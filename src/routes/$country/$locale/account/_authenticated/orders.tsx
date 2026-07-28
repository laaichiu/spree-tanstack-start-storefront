import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/orders',
)({
  component: AccountOrdersLayout,
})

function AccountOrdersLayout() {
  return <Outlet />
}
