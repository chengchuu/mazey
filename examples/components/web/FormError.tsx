export interface FormErrorProps {
  message: string | null;
}

export function FormError({
  message,
}: FormErrorProps): React.JSX.Element | null {
  if (!message) return null;
  return (
    <p className="alert alert-danger playground-error mt-3 mb-0" role="alert">
      {message}
    </p>
  );
}
