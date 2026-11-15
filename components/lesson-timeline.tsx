import type { LessonStage } from "@/lib/lesson-timeline"
import { cn } from "@/lib/utils"

const STAGE_COLORS = ["bg-stage-1", "bg-stage-2", "bg-stage-3", "bg-stage-4", "bg-stage-5"]

type LessonTimelineProps = {
  stages: LessonStage[]
  details?: string[]
  compact?: boolean
  className?: string
}

// The lesson as one bar: each colour is a stage, its width is its share of the lesson.
export function LessonTimeline({ stages, details, compact = false, className }: LessonTimelineProps) {
  const total = stages.reduce((sum, stage) => sum + stage.minutes, 0)

  return (
    <div className={className}>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`Этапы урока, всего ${total} минут`}>
        {stages.map((stage, index) => (
          <div
            key={stage.title}
            className={cn("h-full transition-[flex-grow] duration-300 ease-out-soft", STAGE_COLORS[index % STAGE_COLORS.length])}
            style={{ flexGrow: stage.minutes, flexBasis: 0 }}
          />
        ))}
      </div>

      <ol className={cn("mt-4", compact ? "space-y-2" : "space-y-3")}>
        {stages.map((stage, index) => (
          <li key={stage.title} className="flex items-start gap-3">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", STAGE_COLORS[index % STAGE_COLORS.length])} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{stage.title}</span>
              {details?.[index] && <span className="block text-sm text-muted-foreground">{details[index]}</span>}
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{stage.minutes} мин</span>
          </li>
        ))}
      </ol>

      <p className="mt-4 border-t border-dashed pt-3 font-mono text-xs tabular-nums text-muted-foreground">
        {stages.map((stage) => stage.minutes).join(" + ")} = {total} мин
      </p>
    </div>
  )
}
