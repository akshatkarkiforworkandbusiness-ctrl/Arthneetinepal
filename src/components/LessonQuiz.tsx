import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertCircle, RotateCcw } from 'lucide-react';

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
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-3">
          <div className="bg-club-green rounded-full p-1.5 shadow-sm">
            <Check size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-text-primary">
            Quiz Passed{existingScore !== undefined ? ` — ${existingScore}%` : ''}
          </span>
        </div>
        <button 
          onClick={() => setActive(true)} 
          className="text-xs font-bold uppercase tracking-wider text-club-green hover:underline flex items-center gap-1"
        >
          <RotateCcw size={14} /> Retake
        </button>
      </div>
    );
  }

  if (!active) {
    return (
      <button 
        onClick={() => setActive(true)} 
        className="w-full bg-white text-club-green border-2 border-club-green py-4 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-club-green hover:text-white transition-all shadow-card hover:shadow-elevated"
      >
        Take Quiz to Complete Lesson
      </button>
    );
  }

  if (submitted) {
    const didPass = score >= 60;
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-3xl p-8 border space-y-6 shadow-card ${
            didPass 
              ? 'bg-emerald-50/70 border-emerald-200' 
              : 'bg-red-50/70 border-red-200'
          }`}
        >
          <div className="text-center space-y-3">
            {/* Draw-in SVG Checkmark or Alert icon */}
            <div className="flex justify-center">
              {didPass ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-club-green text-white flex items-center justify-center shadow-lg"
                >
                  <Check size={32} strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div 
                  animate={{ x: [0, -6, 6, -4, 4, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-16 h-16 rounded-full bg-loser text-white flex items-center justify-center shadow-lg"
                >
                  <AlertCircle size={32} />
                </motion.div>
              )}
            </div>

            <p className={`text-4xl font-bold font-display ${didPass ? 'text-club-green' : 'text-loser'}`}>{score}%</p>
            <p className="text-base font-bold text-text-primary">
              {didPass ? 'Assessment Passed! Module Progress Recorded.' : '60% required to pass this assessment.'}
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            {!didPass && (
              <button 
                onClick={handleRetake} 
                className="px-6 py-3 bg-white text-text-primary border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:border-club-green transition-all shadow-sm"
              >
                Retake Quiz
              </button>
            )}
            <button 
              onClick={() => setActive(false)} 
              className="px-6 py-3 bg-surface-muted text-text-muted border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:text-text-primary transition-all"
            >
              Close Assessment
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="bg-white border border-border rounded-3xl p-8 space-y-8 shadow-card">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Module Quiz — {questions.length} Questions
        </span>
        <span className="text-xs font-bold text-club-green bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          60% Passing Score
        </span>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-4">
          <p className="text-base font-bold text-text-primary">{qi + 1}. {q.question}</p>
          <div className="space-y-2.5">
            {q.options.map((opt, oi) => (
              <motion.button
                key={oi}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  const next = [...answers];
                  next[qi] = oi;
                  setAnswers(next);
                }}
                className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-medium border transition-all ${
                  answers[qi] === oi 
                    ? 'bg-emerald-50 border-club-green text-club-green font-bold shadow-sm' 
                    : 'bg-surface-muted border-border text-text-primary hover:border-club-green/40'
                }`}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full bg-club-green text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#047857] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-elevated"
      >
        Submit Assessment
      </button>
    </div>
  );
}
