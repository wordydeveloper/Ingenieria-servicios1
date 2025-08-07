"use client"

import type React from "react"

interface FormInputProps {
  id: string
  label: string
  type?: string
  value: string | number
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  icon?: string
  min?: number
  max?: number
  pattern?: string
  className?: string
}

export default function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder = "",
  icon,
  min,
  max,
  pattern,
  className = ""
}: FormInputProps) {
  // Ensure value is always controlled
  const controlledValue = value ?? ""

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={`form-group-itla ${className}`}>
      <label htmlFor={id} className="form-label-itla">
        {icon && <i className={`bi ${icon} me-2`}></i>}
        {label} {required && "*"}
      </label>
      <input
        type={type}
        className="form-control-itla"
        id={id}
        value={controlledValue}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        pattern={pattern}
      />
    </div>
  )
}
