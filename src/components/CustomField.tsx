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
                className="font-semibold text-sm text-gray-600 pb-1 block"
            >
                {label}
            </label>
            <input
                type={type}
                {...field}
                {...props}
                className={`border rounded-lg px-3 py-2 mt-1 text-sm w-full${errors[field.name] && touched[field.name] ? " border-red-500" : ""}`}
            />
            {errors[field.name] && touched[field.name] ? (
                <div className="text-red-500 text-sm">{errors[field.name]?.toString()}</div>
            ) : null}
        </div>
    );
}

export default CustomField;