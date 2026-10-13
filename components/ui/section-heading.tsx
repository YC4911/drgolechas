type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  level?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  level = "h2",
}: SectionHeadingProps) {
  const Heading = level;

  return (
    <div
      className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      {eyebrow ? (
        <p className="text-gold mb-3 text-xs font-semibold tracking-[0.16em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <Heading className="font-display text-teal text-3xl leading-tight sm:text-4xl">
        {title}
      </Heading>
      {description ? (
        <p className="text-muted mt-3 text-sm leading-6 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
