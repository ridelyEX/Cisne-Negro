export const QuestionItem = ({ question, selectedValue, onSelect }) => (
  <div className="question-card">
    <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
      {question.id}. {question.text}
    </p>
    <div className="scale-options">
      {[
        0, 1, 2, 3, 4, 5, 6
      ].map((val) => (
        <div
          key={val}
          className={`scale-btn ${selectedValue === val ? 'selected' : ''}`}
          onClick={() => onSelect(question.id, val)}
          style={{ cursor: 'pointer' }}
        >
          {val}
        </div>
      ))}
    </div>
  </div>
);