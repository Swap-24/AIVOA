import ComplaintForm from './components/ComplaintForm';
import CopilotChat from './components/CopilotChat';
import PastComplaintsPanel from './components/PastComplaintsPanel';

export default function App() {
  return (
    <div className="flex h-dvh min-h-0 items-stretch justify-center bg-canvas p-4">
      <div className="grid h-full min-h-0 w-full max-w-350 grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:grid-cols-[1.4fr_1fr]">
        <div className="min-h-0 border-b border-border md:border-b-0 md:border-r">
          <ComplaintForm />
        </div>
        <CopilotChat />
      </div>
      <PastComplaintsPanel />
    </div>
  );
}
