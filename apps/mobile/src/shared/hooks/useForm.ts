import { useState, useCallback } from 'react';

export interface FormField {
  value: any;
  error?: string;
  touched?: boolean;
  dirty?: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

export interface FormConfig {
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  validate?: (values: Record<string, any>) => Record<string, string>;
}

export const useForm = (config: FormConfig) => {
  const [values, setValues] = useState<FormState>(() => {
    return Object.keys(config.initialValues).reduce((acc, key) => {
      acc[key] = {
        value: config.initialValues[key],
        error: undefined,
        touched: false,
        dirty: false,
      };
      return acc;
    }, {} as FormState);
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = useCallback(
    (fieldName: string, value: any) => {
      setValues(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          value: value !== undefined ? value : prev[fieldName]?.value,
          dirty: true,
        },
      }));

      // Clear error when user starts typing
      if (values[fieldName]?.error) {
        setValues(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            error: undefined,
            value: prev[fieldName]?.value,
          },
        }));
      }
    },
    [values],
  );

  const handleBlur = useCallback((fieldName: string) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true,
        value: prev[fieldName]?.value,
      },
    }));
  }, []);

  const validate = useCallback(() => {
    if (!config.validate) return true;

    const flatValues = Object.keys(values).reduce(
      (acc, key) => {
        acc[key] = values[key]?.value;
        return acc;
      },
      {} as Record<string, any>,
    );

    const errors = config.validate(flatValues);

    if (Object.keys(errors).length > 0) {
      setValues(prev => {
        const updated = { ...prev };
        Object.keys(errors).forEach(key => {
          if (updated[key]) {
            updated[key] = {
              ...updated[key],
              error: errors[key],
            };
          }
        });
        return updated;
      });
      return false;
    }

    return true;
  }, [config.validate, values]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const flatValues = Object.keys(values).reduce(
        (acc, key) => {
          acc[key] = values[key]?.value;
          return acc;
        },
        {} as Record<string, any>,
      );

      await config.onSubmit(flatValues);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An error occurred',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [config.onSubmit, validate, values]);

  const resetForm = useCallback(() => {
    setValues(() => {
      return Object.keys(config.initialValues).reduce((acc, key) => {
        acc[key] = {
          value: config.initialValues[key],
          error: undefined,
          touched: false,
          dirty: false,
        };
        return acc;
      }, {} as FormState);
    });
    setSubmitError(null);
  }, [config.initialValues]);

  return {
    values,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue: (fieldName: string, value: any) =>
      handleChange(fieldName, value),
  };
};
