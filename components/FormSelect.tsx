"use client"

import type React from "react"

interface Option {
  value: string | number
  label: string
}

interface FormSelectProps {
  id: string
  label: string
  value: string | number
  onChange: (value: string) => void
  options: Option[]
  required?: boolean
  icon?: string
  className?: string
}

export default function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  icon,
  className = ""
}: FormSelectProps) {
  // Ensure value is always controlled
  const controlledValue = value ?? ""

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={`form-group-itla ${className}`}>
      <label htmlFor={id} className="form-label-itla">
        {icon && <i className={`bi ${icon} me-2`}></i>}
        {label} {required && "*"}
      </label>
      <select
        className="form-control-itla"
        id={id}
        value={controlledValue}
        onChange={handleChange}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
