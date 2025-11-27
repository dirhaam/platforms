'use client';

interface SectionHeaderProps {
  icon: string;
  title: string;
}

export function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
        <i className={`bx ${icon} text-primary dark:text-[#a5a7ff]`}></i>
      </div>
      <h3 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">{title}</h3>
    </div>
  );
}
