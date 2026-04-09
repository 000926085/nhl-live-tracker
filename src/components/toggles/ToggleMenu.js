import React, { useState } from 'react';

/**
 * Generalized implementation of a dropdown menu for various types of filters.
 * @param {String} category key of a dropdownOptions item
 * @param {dict} options label and value of the dropdownOptions item
 * @param {arr} selected array of the currently selected checkbox values
 * @param {Function} onToggle callback to handle behaviour when selecting or unselecting a checkbox
 * @returns {JSX.Element} a dropdown menu containing checkboxes
 */
const ToggleMenu = ({ category, options, selected, onToggle}) => {
  const [active, setActive] = useState(false);

  return (
    <div className="filter-container">
      <span>{category.replace(/([A-Z])/g, ' $1')}</span>
      <div className="filter-pill" onClick={() => setActive(!active)}>
        <span>{selected.length === options.length ? 'All' : `${selected.length} Selected`}</span>
        <span>{active ? '∧' : '∨'}</span>
      </div>

      {active && (
        <div className='filter-options'>
          {options.map(o => (
            <div key={o.value} onClick={() => onToggle(o.value)}>
              <input type="checkbox" checked={selected.includes(o.value)} readOnly/>
              <span style={{marginLeft: '5px'}}>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ToggleMenu