type AnnouncementBarProps = {
  message?: string;
};

export function AnnouncementBar({
  message = "Herbal wellness for everyday rituals from Maharashtra",
}: AnnouncementBarProps) {
  return (
    <div className="bg-teal px-4 py-2 text-center text-[11px] font-medium tracking-[0.08em] text-white sm:text-xs">
      {message}
    </div>
  );
}
