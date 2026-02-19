export const Spinner = ({ size = 20 }: { size?: number }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className="border-2 border-white border-t-transparent rounded-full animate-spin"
    />
  );
};
