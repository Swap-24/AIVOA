import ComplaintForm from './components/ComplaintForm';
import CopilotChat from './components/CopilotChat';

export default function App() {
  return (
    <div className="flex h-screen items-stretch justify-center bg-canvas p-4">
      <div className="grid h-full w-full max-w-350 grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:grid-cols-[1.4fr_1fr]">
        <div className="border-b border-border md:border-b-0 md:border-r">
          <ComplaintForm />
        </div>
        <CopilotChat />
      </div>
    </div>
  );
}