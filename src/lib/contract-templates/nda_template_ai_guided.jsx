import { useState } from "react";

const initialData = {
  disclosing_party_name: "",
  disclosing_party_address: "",
  receiving_party_name: "",
  receiving_party_address: "",
  discussion_subject: "",
  non_compete_clause: true,
  additional_info_types: "",
  restriction_duration_months: "60",
  arbitration_location: "Nairobi",
  disclosing_email: "",
  receiving_email: "",
  disclosing_signature: "",
  receiving_signature: ""
};

export default function NDAContractForm() {
  const [formData, setFormData] = useState(initialData);
  const [activeClauses, setActiveClauses] = useState({
    non_compete: true,
    return_destroy: true,
    arbitration: true
  });

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleClause = (clause) => {
    setActiveClauses((prev) => ({ ...prev, [clause]: !prev[clause] }));
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto text-sm">
      <h1 className="text-xl font-bold text-center">CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT</h1>

      <p>
        This agreement is made between
        <input className="border-b border-gray-500 mx-2" value={formData.disclosing_party_name} onChange={(e) => handleChange("disclosing_party_name", e.target.value)} placeholder="Disclosing Party" />
        and
        <input className="border-b border-gray-500 mx-2" value={formData.receiving_party_name} onChange={(e) => handleChange("receiving_party_name", e.target.value)} placeholder="Receiving Party" />.
      </p>

      <h2 className="font-semibold">1. Introduction</h2>
      <p>The parties are entering discussions regarding
        <input className="border-b border-gray-500 mx-2" value={formData.discussion_subject} onChange={(e) => handleChange("discussion_subject", e.target.value)} placeholder="discussion subject" />.
      </p>

      {activeClauses.non_compete && (
        <div className="bg-gray-50 p-3 border rounded">
          <label className="font-semibold">
            <input type="checkbox" checked={activeClauses.non_compete} onChange={() => toggleClause("non_compete")} className="mr-2" />
            Non-Compete Clause
          </label>
          <p>The Receiving Party shall not carry out any related services without written consent from the Disclosing Party.</p>
        </div>
      )}

      <h2 className="font-semibold">2. Confidential Information</h2>
      <p>This includes technical, financial, or operational data shared during engagement, including:
        <input className="border-b border-gray-500 mx-2" value={formData.additional_info_types} onChange={(e) => handleChange("additional_info_types", e.target.value)} placeholder="additional information" />
      </p>

      <h2 className="font-semibold">3. Use and Disclosure Restrictions</h2>
      <p>No party shall disclose shared information for
        <input className="w-16 border-b border-gray-500 mx-2 text-center" value={formData.restriction_duration_months} onChange={(e) => handleChange("restriction_duration_months", e.target.value)} placeholder="months" /> months.
      </p>

      {activeClauses.return_destroy && (
        <div className="bg-gray-50 p-3 border rounded">
          <label className="font-semibold">
            <input type="checkbox" checked={activeClauses.return_destroy} onChange={() => toggleClause("return_destroy")} className="mr-2" />
            Return or Destruction of Materials
          </label>
          <p>The Receiving Party must return or destroy all confidential materials upon request and confirm in writing.</p>
        </div>
      )}

      <h2 className="font-semibold">4. Standard of Care</h2>
      <p>Each party agrees to safeguard confidential information with the same standard they use for their own sensitive data.</p>

      {activeClauses.arbitration && (
        <div className="bg-gray-50 p-3 border rounded">
          <label className="font-semibold">
            <input type="checkbox" checked={activeClauses.arbitration} onChange={() => toggleClause("arbitration")}/> Arbitration Clause
          </label>
          <p>Any disputes will be resolved via arbitration held in
            <input className="border-b border-gray-500 mx-2" value={formData.arbitration_location} onChange={(e) => handleChange("arbitration_location", e.target.value)} placeholder="arbitration location" />.
          </p>
        </div>
      )}

      <h2 className="font-semibold">5. Notices</h2>
      <p>
        Disclosing Party Email:
        <input className="border-b border-gray-500 mx-2" value={formData.disclosing_email} onChange={(e) => handleChange("disclosing_email", e.target.value)} placeholder="email" /><br/>
        Receiving Party Email:
        <input className="border-b border-gray-500 mx-2" value={formData.receiving_email} onChange={(e) => handleChange("receiving_email", e.target.value)} placeholder="email" />
      </p>

      <h2 className="font-semibold">6. Signatures</h2>
      <p>Disclosing Party Signature: <input className="border-b border-gray-500 mx-2" value={formData.disclosing_signature} onChange={(e) => handleChange("disclosing_signature", e.target.value)} placeholder="Signature" /></p>
      <p>Receiving Party Signature: <input className="border-b border-gray-500 mx-2" value={formData.receiving_signature} onChange={(e) => handleChange("receiving_signature", e.target.value)} placeholder="Signature" /></p>
    </div>
  );
}
