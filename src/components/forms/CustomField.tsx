import { FieldProps } from 'formik';
import React from 'react';

interface CustomFieldProps extends FieldProps {
    type?: string;
    label?: string;
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
            <label
                htmlFor={props.id || props.name}
                className="font-semibold text-sm text-base-content pb-1 block"
            >
                {label}
            </label>
            <input
                type={type}
                {...field}
                {...props}
                className={`input input-bordered px-3 py-2 mt-1 first-letter:text-sm w-full${errors[field.name] && touched[field.name] ? " border-error" : ""}`}
            />
            {errors[field.name] && touched[field.name] ? (
                <div className="text-error text-sm">{errors[field.name]?.toString()}</div>
            ) : null}
        </div>
    );
}

export default CustomField;