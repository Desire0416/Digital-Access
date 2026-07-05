import { Loader } from "@da/ui";

export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <Loader size={72} label="Chargement du contenu…" />
    </div>
  );
}
