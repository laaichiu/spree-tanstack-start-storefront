import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useController, useForm } from 'react-hook-form'

import { getCustomerProfileFormDefaults } from '@/lib/account/contracts'
import {
  useAccountSession,
  useAccountSessionRequiredRedirect,
} from '@/lib/account/client/account-session-provider'
import { hasPendingCustomerProfileMutation } from '@/lib/account/client/customer-profile-mutation'
import { useCustomerProfileUpdate } from '@/lib/account/client/use-customer-profile-update'
import type { CustomerProfileUpdateInput } from '@/lib/account/validation/profile'
import { customerProfileUpdateSchema } from '@/lib/account/validation/profile'
import { isCustomerSessionRequiredError } from '@/lib/account/utils/customer-session-error'

import { useMarket } from '@/components/layout/market-provider'

export function useAccountProfileFormController() {
  const queryClient = useQueryClient()
  const { market } = useMarket()
  const customer = useAccountSession()
  const profileContextKey = `${customer.id}:${market.country}:${market.locale}`
  const profileContextGenerationRef = useRef(0)
  const previousProfileContextKeyRef = useRef(profileContextKey)

  if (previousProfileContextKeyRef.current !== profileContextKey) {
    previousProfileContextKeyRef.current = profileContextKey
    profileContextGenerationRef.current += 1
  }

  const profileContextOwner = `${profileContextGenerationRef.current}:${profileContextKey}`
  const currentProfileContextOwnerRef = useRef(profileContextOwner)
  currentProfileContextOwnerRef.current = profileContextOwner
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])
  const profileMutationInFlightRef = useRef<string | null>(null)
  const redirectToLogin = useAccountSessionRequiredRedirect()
  const redirectToLoginRef = useRef(redirectToLogin)
  redirectToLoginRef.current = redirectToLogin
  const router = useRouter()
  const [sessionRequired, setSessionRequired] = useState(false)
  const [profileMutationOwner, setProfileMutationOwner] = useState<
    string | null
  >(null)
  const [profileErrorOwner, setProfileErrorOwner] = useState<string | null>(
    null,
  )
  const [savedMessageOwner, setSavedMessageOwner] = useState<string | null>(
    null,
  )
  const [savedMessageVisible, setSavedMessageVisible] = useState(false)
  const isProfileMutationPending = profileMutationOwner === profileContextOwner
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<CustomerProfileUpdateInput>({
    defaultValues: getCustomerProfileFormDefaults(customer),
    resolver: zodResolver(customerProfileUpdateSchema),
  })
  const { field: marketingField } = useController({
    control,
    name: 'acceptsEmailMarketing',
  })

  function isCurrentProfileOwner(
    ownerId: string | undefined,
  ): ownerId is string {
    return (
      isMountedRef.current && ownerId === currentProfileContextOwnerRef.current
    )
  }

  const profileMutation = useCustomerProfileUpdate({
    market: { country: market.country, locale: market.locale },
    onError: async (error, ownerId) => {
      if (!isCurrentProfileOwner(ownerId)) {
        return
      }

      setSavedMessageVisible(false)
      setSavedMessageOwner(null)
      setProfileErrorOwner(ownerId)

      if (isCustomerSessionRequiredError(error)) {
        setSessionRequired(true)
        await redirectToLoginRef.current()
        return
      }

      setSessionRequired(false)
    },
    onUpdated: async (updatedCustomer, ownerId) => {
      if (!isCurrentProfileOwner(ownerId)) {
        return
      }

      setSessionRequired(false)
      setProfileErrorOwner(null)
      reset(getCustomerProfileFormDefaults(updatedCustomer))
      setSavedMessageVisible(true)
      setSavedMessageOwner(ownerId)
      await router.invalidate()
    },
  })
  const resetProfileMutationRef = useRef(profileMutation.reset)
  resetProfileMutationRef.current = profileMutation.reset

  useEffect(() => {
    setSessionRequired(false)
    setProfileMutationOwner(null)
    setProfileErrorOwner(null)
    setSavedMessageOwner(null)
    reset(getCustomerProfileFormDefaults(customer))
    setSavedMessageVisible(false)
    resetProfileMutationRef.current()
  }, [customer, profileContextOwner, reset])

  function submitProfile(data: CustomerProfileUpdateInput) {
    if (
      profileMutationInFlightRef.current === profileContextOwner ||
      isProfileMutationPending ||
      hasPendingCustomerProfileMutation({
        market,
        ownerId: profileContextOwner,
        queryClient,
      })
    ) {
      return
    }

    profileMutationInFlightRef.current = profileContextOwner
    setProfileMutationOwner(profileContextOwner)
    setSessionRequired(false)
    setProfileErrorOwner(null)
    setSavedMessageOwner(null)
    setSavedMessageVisible(false)
    profileMutation.mutate(
      { data, ownerId: profileContextOwner },
      {
        onSettled: () => {
          if (profileMutationInFlightRef.current === profileContextOwner) {
            profileMutationInFlightRef.current = null
            setProfileMutationOwner(null)
          }
        },
      },
    )
  }

  return {
    customer,
    form: {
      errors,
      handleSubmit,
      isDirty,
      marketingField,
      register,
    },
    submit: submitProfile,
    state: {
      error:
        profileErrorOwner === profileContextOwner &&
        profileMutation.isError &&
        !sessionRequired,
      isPending: isProfileMutationPending,
      savedMessageVisible:
        savedMessageOwner === profileContextOwner && savedMessageVisible,
    },
  }
}
