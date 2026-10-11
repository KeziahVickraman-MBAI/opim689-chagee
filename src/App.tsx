import { useEffect, useState } from 'react';
import { useScenarioStore } from './state/scenarios';
import { useAnalysis } from './state/analysis';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Predict } from './sections/Predict';
import { Provision } from './sections/Provision';
import { Counter } from './sections/Counter';
import { Review } from './sections/Review';
import { Summary } from './sections/Summary';
import { ValidationQuestions } from './sections/ValidationQuestions';
import { AssumptionsPanel } from './ui/AssumptionsPanel';

export default function App() {
  const store = useScenarioStore();
  const an = useAnalysis(store.active.inputs);   // one shared result set: every section reads the same scenario
  const [printReq, setPrintReq] = useState(0);
  const s = store.section;

  useEffect(() => { window.scrollTo({ top: 0 }); }, [s]);
  useEffect(() => { if (printReq) { const t = setTimeout(() => window.print(), 50); return () => clearTimeout(t); } }, [printReq]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EA] text-[#0A2146] print:bg-white">
      <Header store={store} an={an} onPrint={() => setPrintReq(x => x + 1)} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:hidden">
        {s === 'predict' && <Predict store={store} an={an} />}
        {s === 'provision' && <Provision store={store} an={an} />}
        {s === 'counter' && <Counter store={store} an={an} />}
        {s === 'review' && <Review store={store} an={an} />}
        {s === 'summary' && <Summary store={store} an={an} />}
        {s === 'questions' && <ValidationQuestions onNavigateTab={store.setSection} />}
        {['predict', 'provision', 'counter', 'review'].includes(s) && <AssumptionsPanel store={store} an={an} />}
      </main>
      {/* Printing from any section prints the decision summary. */}
      <div className="hidden print:block"><Summary store={store} an={an} /></div>
      <Footer />
    </div>
  );
}
