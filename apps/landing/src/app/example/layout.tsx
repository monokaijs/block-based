import { Navbar } from "@/components/navbar";

export default function ExampleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
