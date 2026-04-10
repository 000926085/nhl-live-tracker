/**
 * Constructs a row of buttons used to change the strength state for the shotmap and statistics.
 * @param {boolean} active used to determine button styling if selected.
 * @param {Function} onChange callback to dictate behaviour upon selection.
 * @returns {JSX.Element} row of buttons to change the strength state.
 */
const StrengthToggle = ({active, onChange}) => {
  const btns = ['ALL', 'EV', 'ALL w/o ENG'];

  return (
    <div style={{display: 'flex', flexDirection: 'row',  flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',  gap: '12px', padding: '10px 0', width: '100%' }}>
      <h1 className='title' style={{ margin: 0, fontSize: '1.6rem',}}>
        Strength State
      </h1>

      {/* Button Group */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {btns.map((b) => (
          <button key={b} className={`item ${b === active ? 'btn_on' : 'btn_off'} btn`} onClick={() => onChange(b)}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StrengthToggle;