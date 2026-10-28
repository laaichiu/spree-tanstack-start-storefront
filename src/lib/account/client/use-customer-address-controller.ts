import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { CustomerAddress } from '@/lib/account/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import {
  useAccountSession,
  useAccountSessionRequiredRedirect,
} from './account-session-provider'
import { useCustomerAddressMutations } from './use-customer-address-mutations'
import {
  getCustomerAddressMutationKey,
  hasPendingCustomerAddressMutation,
} from './customer-address-mutation'
import type { CustomerAddressInput } from '../validation/address'
import { readAccountMutationErrorMessage } from '../utils/account-error'
import { isCustomerSessionRequiredError } from '../utils/customer-session-error'

type CustomerAddressControllerOptions = {
  addresses: readonly CustomerAddress[]
  deleteErrorMessage: string
  fallbackCountry: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onChanged?: () => void | Promise<void>
  saveErrorMessage: string
}

export function useCustomerAddressController({
  addresses,
  deleteErrorMessage,
  fallbackCountry,
  market,
  onChanged,
  saveErrorMessage,
}: CustomerAddressControllerOptions) {
  const queryClient = useQueryClient()
  const customer = useAccountSession()
  const redirectToLogin = useAccountSessionRequiredRedirect()
  const addressMutationKey = getCustomerAddressMutationKey(market)
  const addressMarketKey = addressMutationKey.join(':')
  const addressContextKey = `${customer.id}:${addressMarketKey}`
  const addressContextGenerationRef = useRef(0)
  const previousAddressContextKeyRef = useRef(addressContextKey)

  if (previousAddressContextKeyRef.current !== addressContextKey) {
    previousAddressContextKeyRef.current = addressContextKey
    addressContextGenerationRef.current += 1
  }

  const addressContextOwner = `${addressContextGenerationRef.current}:${addressContextKey}`
  const currentAddressContextOwnerRef = useRef(addressContextOwner)
  currentAddressContextOwnerRef.current = addressContextOwner
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])
  const addressMutationInFlightRef = useRef<string | null>(null)
  const [pendingAddressMutation, setPendingAddressMutation] = useState<{
    operation: 'delete' | 'save'
    owner: string
  } | null>(null)
  const isAddressMutationPending =
    pendingAddressMutation?.owner === addressContextOwner
  const [isAddressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<CustomerAddress | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function isCurrentAddressOwner(ownerId: string | undefined) {
    return (
      isMountedRef.current && ownerId === currentAddressContextOwnerRef.current
    )
  }

  const { addressMutation, deleteMutation } = useCustomerAddressMutations({
    market,
    onDeleteError: async (error, ownerId) => {
      if (!isCurrentAddressOwner(ownerId)) {
        return
      }

      if (isCustomerSessionRequiredError(error)) {
        setDeleteTarget(null)
        setErrorMessage(null)
        await redirectToLogin()
        return
      }

      setErrorMessage(
        readAccountMutationErrorMessage(error, deleteErrorMessage),
      )
    },
    onDeleted: async (ownerId) => {
      if (!isCurrentAddressOwner(ownerId)) {
        return
      }

      setDeleteTarget(null)
      setErrorMessage(null)
      await onChanged?.()
    },
    onSaveError: async (error, ownerId) => {
      if (!isCurrentAddressOwner(ownerId)) {
        return
      }

      if (isCustomerSessionRequiredError(error)) {
        setAddressDialogOpen(false)
        setEditingAddress(null)
        setErrorMessage(null)
        await redirectToLogin()
        return
      }

      setErrorMessage(readAccountMutationErrorMessage(error, saveErrorMessage))
    },
    onSaved: async (ownerId) => {
      if (!isCurrentAddressOwner(ownerId)) {
        return
      }

      setAddressDialogOpen(false)
      setEditingAddress(null)
      setErrorMessage(null)
      await onChanged?.()
    },
  })
  const resetAddressMutationRef = useRef(addressMutation.reset)
  const resetDeleteMutationRef = useRef(deleteMutation.reset)
  resetAddressMutationRef.current = addressMutation.reset
  resetDeleteMutationRef.current = deleteMutation.reset

  useEffect(() => {
    setAddressDialogOpen(false)
    setEditingAddress(null)
    setDeleteTarget(null)
    setErrorMessage(null)
    setPendingAddressMutation(null)
    resetAddressMutationRef.current()
    resetDeleteMutationRef.current()
  }, [addressContextOwner])

  useEffect(() => {
    const editingAddressStillExists =
      editingAddress === null ||
      addresses.some(({ id }) => id === editingAddress.id)
    const deleteTargetStillExists =
      deleteTarget === null ||
      addresses.some(({ id }) => id === deleteTarget.id)

    if (editingAddressStillExists && deleteTargetStillExists) {
      return
    }

    if (!editingAddressStillExists) {
      setAddressDialogOpen(false)
      setEditingAddress(null)
    }

    if (!deleteTargetStillExists) {
      setDeleteTarget(null)
    }

    setErrorMessage(null)
  }, [addresses, deleteTarget, editingAddress])

  const openAddressDialog = useCallback(
    (address: CustomerAddress | null) => {
      setEditingAddress(address)
      setErrorMessage(null)
      addressMutation.reset()
      setAddressDialogOpen(true)
    },
    [addressMutation],
  )

  const deleteAddress = useCallback(
    (addressId: string) => {
      const address = addresses.find(({ id }) => id === addressId)

      if (!address) {
        return
      }

      setErrorMessage(null)
      setDeleteTarget(address)
    },
    [addresses],
  )

  const editAddress = useCallback(
    (addressId: string) => {
      const address = addresses.find(({ id }) => id === addressId)

      if (address) {
        openAddressDialog(address)
      }
    },
    [addresses, openAddressDialog],
  )

  const submitAddress = useCallback(
    (values: CustomerAddressInput) => {
      if (
        addressMutationInFlightRef.current === addressContextOwner ||
        isAddressMutationPending ||
        hasPendingCustomerAddressMutation({
          addressId: editingAddress?.id ?? null,
          mutationKey: addressMutationKey,
          operation: 'save',
          ownerId: addressContextOwner,
          queryClient,
        })
      ) {
        return
      }

      addressMutationInFlightRef.current = addressContextOwner
      setPendingAddressMutation({
        operation: 'save',
        owner: addressContextOwner,
      })
      addressMutation.mutate(
        {
          id: editingAddress?.id,
          ownerId: addressContextOwner,
          values,
        },
        {
          onSettled: () => {
            if (
              isMountedRef.current &&
              addressMutationInFlightRef.current === addressContextOwner
            ) {
              addressMutationInFlightRef.current = null
              setPendingAddressMutation(null)
            }
          },
        },
      )
    },
    [
      addressContextOwner,
      addressMutation,
      addressMutationKey,
      editingAddress?.id,
      isAddressMutationPending,
      queryClient,
    ],
  )

  const confirmDelete = useCallback(() => {
    if (
      !deleteTarget ||
      addressMutationInFlightRef.current === addressContextOwner ||
      isAddressMutationPending ||
      hasPendingCustomerAddressMutation({
        addressId: deleteTarget.id,
        mutationKey: addressMutationKey,
        operation: 'delete',
        ownerId: addressContextOwner,
        queryClient,
      })
    ) {
      return
    }

    addressMutationInFlightRef.current = addressContextOwner
    setPendingAddressMutation({
      operation: 'delete',
      owner: addressContextOwner,
    })
    deleteMutation.mutate(
      { addressId: deleteTarget.id, ownerId: addressContextOwner },
      {
        onSettled: () => {
          if (
            isMountedRef.current &&
            addressMutationInFlightRef.current === addressContextOwner
          ) {
            addressMutationInFlightRef.current = null
            setPendingAddressMutation(null)
          }
        },
      },
    )
  }, [
    addressContextOwner,
    addressMutationKey,
    deleteMutation,
    deleteTarget,
    isAddressMutationPending,
    queryClient,
  ])

  return {
    actions: {
      add: () => openAddressDialog(null),
      delete: deleteAddress,
      edit: editAddress,
    },
    addressDialog: {
      address: editingAddress,
      fallbackCountry,
      isPending:
        pendingAddressMutation?.owner === addressContextOwner &&
        pendingAddressMutation.operation === 'save',
      onOpenChange: setAddressDialogOpen,
      onSubmit: submitAddress,
      open: isAddressDialogOpen,
    },
    deleteDialog: {
      address: deleteTarget,
      isPending:
        pendingAddressMutation?.owner === addressContextOwner &&
        pendingAddressMutation.operation === 'delete',
      onConfirm: confirmDelete,
      onOpenChange: (open: boolean) => {
        if (!open) {
          setDeleteTarget(null)
        }
      },
    },
    errorMessage,
    pendingDeleteAddressId:
      pendingAddressMutation?.owner === addressContextOwner &&
      pendingAddressMutation.operation === 'delete'
        ? (deleteTarget?.id ?? null)
        : null,
  }
}
