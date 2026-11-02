import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const mask = (v) => (v ? `XXXX XXXX ${String(v).slice(-4)}` : '');

/* Bank and statutory details. The account number stays masked until the viewer chooses to reveal it. */
export function BankDetails({ bank = {} }) {
    const [revealed, setRevealed] = useState(false);
    const rows = [
        ['Account holder', bank.accountHolderName],
        ['Bank', bank.bankName],
        ['Account number', revealed ? bank.accountNumber : mask(bank.accountNumber), true],
        ['IFSC', bank.ifscCode, true],
        ['PAN', bank.panNumber, true],
        ['UAN', bank.uanNumber, true],
    ];
    return (<div className="kv-card">
      <div className="kv-card-head">
        <h4 className="eyebrow">Bank &amp; statutory</h4>
        {bank.accountNumber && (<button type="button" className="link-button" onClick={() => setRevealed((v) => !v)} aria-pressed={revealed}>
            {revealed ? <EyeOff size={14}/> : <Eye size={14}/>} {revealed ? 'Hide' : 'Show'} account no.
          </button>)}
      </div>
      <dl className="kv-list">
        {rows.map(([label, value, mono]) => (<div key={label}>
            <dt>{label}</dt>
            <dd className={mono ? 'mono' : ''}>{value || <span className="kv-missing">Not provided</span>}</dd>
          </div>))}
      </dl>
    </div>);
}
