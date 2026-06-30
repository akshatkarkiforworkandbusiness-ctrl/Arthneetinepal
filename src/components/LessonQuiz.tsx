import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface LessonQuizProps {
  lessonId: string;
  questions: QuizQuestion[];
  passed: boolean;
  existingScore?: number;
  onSubmit: (lessonId: string, scorePercent: number) => void;
}

export default function LessonQuiz({ lessonId, questions, passed, existingScore, onSubmit }: LessonQuizProps) {
  const [active, setActive] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setActive(false);
    setAnswers(new Array(questions.length).fill(null));
    setSubmitted(false);
    setScore(0);
  }, [lessonId, questions.length]);

  const allAnswered = answers.every(a => a !== null);

  const handleSubmit = () => {
    const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
    const percent = Math.round((correct / questions.length) * 100);
    setScore(percent);
    setSubmitted(true);
    onSubmit(lessonId, percent);
  };

  const handleRetake = () => {
    setAnswers(new Array(questions.length).fill(null));
    setSubmitted(false);
    setScore(0);
  };

  if (passed && !active) {
    return (
      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 rounded-full p-1.5">
            <Check size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">
            Quiz passed{existingScore !== undefined ? ` — ${existingScore}%` : ''}
          </span>
        </div>
        <button onClick={() => setActive(true)} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
          Retake
        </button>
      </div>
    );
  }

  if (!active) {
    return (
      <button onClick={() => setActive(true)} className="w-full bg-royal/20 text-royal border border-royal/30 py-5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-royal hover:text-white transition-all">
        Take Quiz to Complete Lesson
      </button>
    );
  }

  if (submitted) {
    const didPass = score >= 60;
    return (
      <div className={`rounded-xl p-8 border space-y-6 ${didPass ? 'bg-green-500/5 border-green-500/20' : 'bg-crimson/5 border-crimson/20'}`}>
        <div className="text-center space-y-2">
          <p className={`text-4xl font-display italic ${didPass ? 'text-green-400' : 'text-crimson'}`}>{score}%</p>
          <p className="text-sm font-bold text-white">
            {didPass ? 'Passed — lesson complete' : 'Not quite — 60% needed to pass'}
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          {!didPass && (
            <button onClick={handleRetake} className="px-6 py-3 bg-white/5 text-white border border-white/10 rounded text-[10px] font-black uppercase tracking-widest hover:border-royal/50 transition-all">
              Retake Quiz
            </button>
          )}
          <button onClick={() => setActive(false)} className="px-6 py-3 bg-white/5 text-gray-400 border border-white/10 rounded text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl p-8 space-y-8">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        Quiz — {questions.length} questions, 60% to pass
      </p>
      {questions.map((q, qi) => (
        <div key={qi} className="space-y-4">
          <p className="text-sm font-bold text-white">{qi + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => {
                  const next = [...answers];
                  next[qi] = oi;
                  setAnswers(next);
                }}
                className={`w-full text-left px-5 py-3 rounded-lg text-sm font-sans border transition-all ${
                  answers[qi] === oi ? 'bg-royal/20 border-royal text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full bg-crimson text-white py-4 rounded text-[10px] font-black uppercase tracking-widest hover:bg-royal transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Submit Quiz
      </button>
    </div>
  );
}
