import React from 'react';
import { cn } from '../../lib/utils';

interface AnvilIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const AnvilIcon: React.FC<AnvilIconProps> = ({ className, ...props }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6 shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M2.5 8.5C2.5 8.22 2.72 8 3 8H17C18.66 8 20 9.34 20 11C20 12.19 19.3 13.22 18.28 13.71L16 14.5V16C16 16.55 15.55 17 15 17H13.5C13.22 17 13 17.22 13 17.5V18H16C16.55 18 17 18.45 17 19V20.5H5V19C5 18.45 5.45 18 6 18H9V17.5C9 17.22 8.78 17 8.5 17H7C6.45 17 6 16.55 6 16V14.5L4.25 13.7C3.21 13.2 2.5 12.18 2.5 11V8.5Z" />
    </svg>
  );
};
