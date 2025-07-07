interface PlusSuccessIconProps {
  className?: string
}

export function PlusSuccessIcon({ className }: PlusSuccessIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8 14.4C4.48 14.4 1.6 11.52 1.6 8C1.6 4.48 4.48 1.6 8 1.6C11.52 1.6 14.4 4.48 14.4 8C14.4 11.52 11.52 14.4 8 14.4ZM11.2 8C11.2 8.48 10.88 8.8 10.4 8.8H8.8V10.4C8.8 10.88 8.48 11.2 8 11.2C7.52 11.2 7.2 10.88 7.2 10.4V8.8H5.6C5.12 8.8 4.8 8.48 4.8 8C4.8 7.52 5.12 7.2 5.6 7.2H7.2V5.6C7.2 5.12 7.52 4.8 8 4.8C8.48 4.8 8.8 5.12 8.8 5.6V7.2H10.4C10.88 7.2 11.2 7.52 11.2 8Z"
        fill="currentColor"
      />
    </svg>
  )
}
