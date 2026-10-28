import { useAnnouncementBannerController } from './use-announcement-banner-controller'

export function AnnouncementBannerView({
  label,
  messages,
}: {
  label: string
  messages: readonly string[]
}) {
  const {
    activeIndex,
    handleLoopTransition,
    isTransitionEnabled,
    renderedMessages,
    stepPercent,
    visibleIndex,
  } = useAnnouncementBannerController(messages)

  return (
    <div
      aria-label={label}
      aria-roledescription="carousel"
      className="relative h-10 overflow-hidden bg-foreground text-background lg:h-8"
      role="group"
    >
      <div className="relative flex h-full items-center justify-center px-12 sm:px-16">
        <div className="relative h-full w-full overflow-hidden">
          <div
            className={
              isTransitionEnabled
                ? 'flex flex-col transform-gpu transition-transform duration-700 ease-out will-change-transform motion-reduce:transition-none'
                : 'flex flex-col transform-gpu will-change-transform'
            }
            onTransitionCancel={handleLoopTransition}
            onTransitionEnd={handleLoopTransition}
            style={{
              transform: `translate3d(0, -${activeIndex * stepPercent}%, 0)`,
            }}
          >
            {renderedMessages.map((message, index) => (
              <p
                aria-hidden={
                  index % Math.max(messages.length, 1) !== visibleIndex
                }
                className="flex h-10 shrink-0 items-center justify-center px-8 text-center text-xs leading-4 font-normal uppercase lg:h-8"
                key={`announcement-${index + 1}`}
              >
                {message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
