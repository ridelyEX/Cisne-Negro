export const QuestionItem = ({ question, selectedValue, onSelect, isMissing = false }) => (

  <div
    className={`question-card ${isMissing ? 'missing-question' : ''}`}
    style={{
        border: isMissing ? '2px solid #ff0303' : '',
        background: isMissing ? '#5a2b29' : '',
        boxShadow: isMissing ? '0 0 0 2px rgba(255, 3, 3, 0.25)' : ''
    }}
  >
    <p style={{
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '1rem' }}
        >
      {question.id}. {question.text}
    </p>

    {isMissing && (
        <p
            style={{
                margin: '0 0 0.75rem 0',
                color: '#a05200',
                fontWeight: '700',
                fontSize: '0.85'
            }}
        >
            Pregunta sin responder
        </p>
    )}

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