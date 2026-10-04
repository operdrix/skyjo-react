import { FieldProps } from "formik";
import React from "react";

interface CustomFieldProps extends FieldProps {
  type?: string;
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const CustomField: React.FC<CustomFieldProps> = ({
  field,
  form: { touched, errors },
  type = "text",
  label = "",
  ...props
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={props.id || props.name} className="font-bold text-sm pb-1 block">
        {label}
      </label>
      <input
        type={type}
        {...field}
        {...props}
        className={`input mt-1 w-full${errors[field.name] && touched[field.name] ? " border-error" : ""}`}
      />
      {errors[field.name] && touched[field.name] ? (
        <div className="text-error text-sm font-semibold mt-1">{errors[field.name]?.toString()}</div>
      ) : null}
    </div>
  );
};

export default CustomField;
