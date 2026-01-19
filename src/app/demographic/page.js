"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function DemographicSurvey() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    gender_other: "",
    education: "",
    race: [],
    hispanic: "",

    // political
    party_id: "",
    party_lean: "", // Q7 (Conditional)
    ideology_scale: "",

    // usage
    use_chatgpt: "",
    use_other_genai: "",
    use_google: "",
    use_other_search: "",
  });

  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [highlightFields, setHighlightFields] = useState([]);
  const fieldRefs = useRef({});

  const requiredFields = [
    "age",
    "gender",
    "education",
    "race",
    "hispanic",

    // political (3)
    "party_id",
    "party_lean",
    "ideology_scale",

    // usage (4)
    "use_chatgpt",
    "use_other_genai",
    "use_google",
    "use_other_search",
  ];

  const USAGE_OPTIONS = [
    "Never",
    "1–2 times",
    "3–5 times",
    "6–10 times",
    "More than 10 times",
  ];

  /* -----------------------------
    Call the previous information
  ------------------------------*/
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);
  }, []);

  /* -----------------------------
     formData--prevent refresh
  ------------------------------*/
  useEffect(() => {
    const saved = localStorage.getItem("demographic_form");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  /* -----------------------------
     formData--auto save
  ------------------------------*/
  useEffect(() => {
    localStorage.setItem("demographic_form", JSON.stringify(formData));
  }, [formData]);

  /* -----------------------------
     Answer check (REQUIRED)
  ------------------------------*/
  const isAnswered = (field) => {
    // race (checkbox)
    if (field === "race") {
      return formData.race.length > 0;
    }

    // party_lean: conditional required
    if (field === "party_lean") {
      return ["Independent", "Another party", "No preference"].includes(
        formData.party_id
      )
        ? String(formData.party_lean ?? "").trim() !== ""
        : true; // Republican / Democrat이면 lean 질문은 자동 충족
    }

    return String(formData[field] ?? "").trim() !== "";
  };

  const getUnansweredRequiredFields = () => {
    return requiredFields.filter((field) => !isAnswered(field));
  };
  const hasUnansweredRequired = () => getUnansweredRequiredFields().length > 0;

  /* -----------------------------
     Change the answer
  ------------------------------*/
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // race (checkbox)
    if (type === "checkbox" && name === "race") {
      setFormData((prev) => ({
        ...prev,
        race: checked
          ? [...prev.race, value]
          : prev.race.filter((r) => r !== value),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setHighlightFields((prev) =>
      String(value ?? "").trim() ? prev.filter((f) => f !== name) : prev
    );
  };

  useEffect(() => {
    if (formData.race.length > 0) {
      setHighlightFields((prev) => prev.filter((f) => f !== "race"));
    }
  }, [formData.race]);

  const buildAirtablePayloadFields = () => {
    const fields = {
      participant_id: participantId,
      ...(Array.isArray(formData.race) && formData.race.length > 0
        ? { race: formData.race }
        : {}),
    };

    const ageStr = String(formData.age ?? "").trim();
    if (ageStr) {
      const ageNum = Number(ageStr);
      if (!Number.isNaN(ageNum)) fields.age = ageNum;
    }

    const genderStr = String(formData.gender ?? "").trim();
    if (genderStr) {
      if (genderStr === "Not listed (please state)") {
        const other = String(formData.gender_other ?? "").trim();
        fields.gender = genderStr;
        if (other) fields.gender_other = other;
      } else {
        fields.gender = genderStr;
      }
    }

    const eduStr = String(formData.education ?? "").trim();
    if (eduStr) fields.education = eduStr;

    const hispStr = String(formData.hispanic ?? "").trim();
    if (hispStr) fields.hispanic = hispStr;

    // political
    if (formData.party_id) fields.party_id = formData.party_id;
    if (formData.party_lean) fields.party_lean = formData.party_lean;
    if (formData.ideology_scale) fields.ideology_scale = formData.ideology_scale;

    // usage
    if (formData.use_chatgpt) fields.use_chatgpt = formData.use_chatgpt;
    if (formData.use_other_genai) fields.use_other_genai = formData.use_other_genai;
    if (formData.use_google) fields.use_google = formData.use_google;
    if (formData.use_other_search) fields.use_other_search = formData.use_other_search;

    return fields;
  };

  /* -----------------------------
    save the data
  ------------------------------*/
  const submitData = async () => {
    if (!participantId) {
      setMessage("Participant ID missing. Please restart the study.");
      setLoading(false);
      return;
    }

    try {
      const fields = buildAirtablePayloadFields();
      const res = await fetch("/api/airtable/demographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Save failed");
      }

      localStorage.removeItem("demographic_form");
      router.push("/thankyou");
    } catch (err) {
      console.error("❌ Error inserting demographic data:", err);
      setMessage("There was an error submitting your response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Submit
  ------------------------------*/
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");

    if (hasUnansweredRequired()) {
      setShowWarningModal(true);
      return;
    }

    setLoading(true);
    submitData();
  };

  /* -----------------------------
     Answer the Question:
  ------------------------------*/
  const handleAnswerTheQuestion = () => {
    setMessage("");

    const highlightTargets = [
      "age",
      "gender",
      "education",
      "race",
      "hispanic",

      "party_id",
      "party_lean",
      "ideology_scale",

      "use_chatgpt",
      "use_other_genai",
      "use_google",
      "use_other_search",
    ];

    const unanswered = highlightTargets.filter((field) => !isAnswered(field));
    setHighlightFields(unanswered);

    const first = unanswered[0];
    if (first && fieldRefs.current[first]) {
      fieldRefs.current[first].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    setShowWarningModal(false);
  };

  /* -----------------------------
     Continue Without Answering:
  ------------------------------*/
  const handleContinueWithoutAnswering = () => {
    setMessage("");
    setShowWarningModal(false);
    setLoading(true);
    submitData();
  };

  const isHighlighted = (fieldName) => highlightFields.includes(fieldName);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <div className="w-full">
        <ProgressBar progress={95} />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-10 overflow-y-auto max-h-[85vh]">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Demographic Questions
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age */}
            <div
              ref={(el) => (fieldRefs.current.age = el)}
              className={
                isHighlighted("age")
                  ? "p-3 rounded-lg border-2 border-red-500"
                  : ""
              }
            >
              <label className="block mb-2 font-medium">What is your age?</label>
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                placeholder="Enter your age"
              />
            </div>

            {/* Gender */}
            <div
              ref={(el) => (fieldRefs.current.gender = el)}
              className={
                isHighlighted("gender")
                  ? "p-3 rounded-lg border-2 border-red-500"
                  : ""
              }
            >
              <label className="block mb-2 font-medium">
                What is your gender identity?
              </label>

              {["Male", "Female", "Non-binary", "Not listed (please state)"].map(
                (option) => (
                  <div key={option} className="flex items-center mb-2 cursor-pointer py-2">
                    <input
                      type="radio"
                      id={option}
                      name="gender"
                      value={option}
                      checked={formData.gender === option}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4"
                    />
                    <label htmlFor={option}>{option}</label>
                  </div>
                )
              )}

              {formData.gender === "Not listed (please state)" && (
                <input
                  type="text"
                  name="gender_other"
                  value={formData.gender_other}
                  onChange={handleChange}
                  placeholder="Please specify"
                  className="w-full border rounded-lg p-2 mt-2"
                />
              )}
            </div>

            {/* Education */}
            <div
              ref={(el) => (fieldRefs.current.education = el)}
              className={
                isHighlighted("education")
                  ? "p-3 rounded-lg border-2 border-red-500"
                  : ""
              }
            >
              <label className="block mb-2 font-medium">
                What is the highest level of school you completed, or the highest
                degree you received?
              </label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Select one</option>
                <option>Never Attended School or Only Attended Kindergarten</option>
                <option>Elementary (Grades 1 through 8)</option>
                <option>Some High School (Grades 9 through 11)</option>
                <option>High School Diploma or Equivalent (Grade 12 or GED)</option>
                <option>Some College or Technical School (College 1 year to 3 years)</option>
                <option>Bachelor&apos;s Degree</option>
                <option>Master&apos;s Degree</option>
                <option>Professional School (JD, MD, etc.) or Doctorate Degree (PhD, EdD)</option>
              </select>
            </div>

            {/* Race */}
            <div
              ref={(el) => (fieldRefs.current.race = el)}
              className={
                isHighlighted("race")
                  ? "p-3 rounded-lg border-2 border-red-500"
                  : ""
              }
            >
              <label className="block mb-2 font-medium">
                Which of the following would you say best describes your race?
                (Check all that apply)
              </label>
              {[
                "White",
                "Black",
                "Asian",
                "American Indian or Alaska Native",
                "Native Hawaiian or Other Pacific Islander",
              ].map((race) => (
                <div key={race} className="flex items-center mb-2 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    id={race}
                    name="race"
                    value={race}
                    checked={formData.race.includes(race)}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4"
                  />
                  <label htmlFor={race}>{race}</label>
                </div>
              ))}
            </div>

            {/* Hispanic */}
            <div
              ref={(el) => (fieldRefs.current.hispanic = el)}
              className={
                isHighlighted("hispanic")
                  ? "p-3 rounded-lg border-2 border-red-500"
                  : ""
              }
            >
              <label className="block mb-2 font-medium">
                Are you Hispanic or Latino/a/x?
              </label>
              {["Yes", "No"].map((option) => (
                <div key={option} className="flex items-center mb-1">
                  <input
                    type="radio"
                    id={option}
                    name="hispanic"
                    value={option}
                    checked={formData.hispanic === option}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor={option}>{option}</label>
                </div>
              ))}
            </div>

            {/* Q6: Party ID */}
            <div
              ref={(el) => (fieldRefs.current.party_id = el)}
              className={
                isHighlighted("party_id")
                  ? "p-3 rounded-lg border-2 border-red-500"
                  : ""
              }
            >
              <label className="block mb-2 font-medium">
                Generally speaking, do you think of yourself as a…
              </label>

              {[
                "Republican",
                "Democrat",
                "Independent",
                "Another party",
                "No preference",
              ].map((opt) => (
                <div key={opt} className="flex items-center mb-1">
                  <input
                    type="radio"
                    name="party_id"
                    value={opt}
                    checked={formData.party_id === opt}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>{opt}</label>
                </div>
              ))}
            </div>

            {/* Q7: Party Lean (Conditional) */}
            {["Independent", "Another party", "No preference"].includes(formData.party_id) && (
              <div
                ref={(el) => (fieldRefs.current.party_lean = el)}
                className={
                  isHighlighted("party_lean")
                    ? "p-3 rounded-lg border-2 border-red-500"
                    : ""
                }
              >
                <label className="block mb-2 font-medium">
                  If you had to choose, do you think of yourself as closer to…
                </label>

                {["Republican Party", "Democratic Party"].map((opt) => (
                  <div key={opt} className="flex items-center mb-1">
                    <input
                      type="radio"
                      name="party_lean"
                      value={opt}
                      checked={formData.party_lean === opt}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label>{opt}</label>
                  </div>
                ))}
              </div>
            )}

            {/* Q8: Ideology Scale */}
            <div
              ref={(el) => (fieldRefs.current.ideology_scale = el)}
              className={
                isHighlighted("ideology_scale")
                  ? "p-3 rounded-lg border-2 border-red-500"
                  : ""
              }
            >
              <label className="block mb-3 font-medium">
                In general, do you think of yourself as…
              </label>

              {[
                "Extremely liberal",
                "Liberal",
                "Slightly liberal",
                "Moderate / middle of the road",
                "Slightly conservative",
                "Conservative",
                "Extremely conservative",
              ].map((opt) => (
                <div key={opt} className="flex items-center mb-1">
                  <input
                    type="radio"
                    name="ideology_scale"
                    value={opt}
                    checked={formData.ideology_scale === opt}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>{opt}</label>
                </div>
              ))}
            </div>

            {/* Tool Usage Frequency */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mt-6">
                How frequently do you use the following tools in a typical week for information seeking?
              </h2>

              {/* ChatGPT */}
              <div
                ref={(el) => (fieldRefs.current.use_chatgpt = el)}
                className={
                  isHighlighted("use_chatgpt")
                    ? "p-3 rounded-lg border-2 border-red-500"
                    : ""
                }
              >
                <label className="block mb-2 font-medium">ChatGPT</label>
                {USAGE_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center mb-1">
                    <input
                      type="radio"
                      name="use_chatgpt"
                      value={opt}
                      checked={formData.use_chatgpt === opt}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label>{opt}</label>
                  </div>
                ))}
              </div>

              {/* Other Generative AI */}
              <div
                ref={(el) => (fieldRefs.current.use_other_genai = el)}
                className={
                  isHighlighted("use_other_genai")
                    ? "p-3 rounded-lg border-2 border-red-500"
                    : ""
                }
              >
                <label className="block mb-2 font-medium">
                  Other Generative AI (e.g., Gemini, Copilot, Perplexity)
                </label>
                {USAGE_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center mb-1">
                    <input
                      type="radio"
                      name="use_other_genai"
                      value={opt}
                      checked={formData.use_other_genai === opt}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label>{opt}</label>
                  </div>
                ))}
              </div>

              {/* Google Search */}
              <div
                ref={(el) => (fieldRefs.current.use_google = el)}
                className={
                  isHighlighted("use_google")
                    ? "p-3 rounded-lg border-2 border-red-500"
                    : ""
                }
              >
                <label className="block mb-2 font-medium">Google Search</label>
                {USAGE_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center mb-1">
                    <input
                      type="radio"
                      name="use_google"
                      value={opt}
                      checked={formData.use_google === opt}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label>{opt}</label>
                  </div>
                ))}
              </div>

              {/* Other Search Engines */}
              <div
                ref={(el) => (fieldRefs.current.use_other_search = el)}
                className={
                  isHighlighted("use_other_search")
                    ? "p-3 rounded-lg border-2 border-red-500"
                    : ""
                }
              >
                <label className="block mb-2 font-medium">
                  Other Search Engines (e.g., Bing, DuckDuckGo)
                </label>
                {USAGE_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center mb-1">
                    <input
                      type="radio"
                      name="use_other_search"
                      value={opt}
                      checked={formData.use_other_search === opt}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label>{opt}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="text-center pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>

              {message && <p className="text-red-600 mt-3">{message}</p>}
            </div>
          </form>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center space-y-6">
            <p>
              There is an unanswered question on this page.
              <br />
              Would you like to continue?
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleContinueWithoutAnswering}
                className="flex-1 border rounded-lg py-2"
                disabled={loading}
              >
                Continue Without Answering
              </button>

              <button
                onClick={handleAnswerTheQuestion}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2"
                disabled={loading}
              >
                Answer the Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
