interface ClockStartIconProps {
  className?: string
}

export function ClockStartIcon({ className }: ClockStartIconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16.8 12.8C16.8 13.24 16.44 13.6 16 13.6H12.8C11.92 13.6 11.2 12.88 11.2 12V8C11.2 7.56 11.56 7.2 12 7.2C12.44 7.2 12.8 7.56 12.8 8V11.2C12.8 11.64 13.16 12 13.6 12H16C16.44 12 16.8 12.36 16.8 12.8ZM20 12C20 16.416 16.416 20 12 20C7.584 20 4 16.416 4 12C4 7.584 7.584 4 12 4C16.416 4 20 7.584 20 12ZM18.4 12C18.4 8.472 15.528 5.6 12 5.6C8.472 5.6 5.6 8.472 5.6 12C5.6 15.528 8.472 18.4 12 18.4C15.528 18.4 18.4 15.528 18.4 12Z"
        fill="#17FF8B"
      />
    </svg>
  )
}
