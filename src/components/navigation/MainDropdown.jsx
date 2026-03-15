import { useState } from "react";
import { NavLink } from "react-router-dom";

const MainDropdown = ({ sections }) => {
  const [openSection, setOpenSection] = useState(null);

  return (
    <div className="absolute left-0 top-full mt-3 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(88,80,236,0.15)] p-4 min-w-[320px]">
        <ul className="space-y-1">
          {sections.map((section, idx) => (
            <li key={idx}>
              {section.path ? (
                <NavLink
                  to={section.path}
                  className="block px-4 py-2 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition"
                >
                  {section.label}
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() =>
                      setOpenSection(
                        openSection === idx ? null : idx
                      )
                    }
                    className="w-full flex items-center justify-between px-4 py-2 rounded-xl hover:bg-purple-50 transition font-medium"
                  >
                    {section.label}
                    <span className="text-xs">▼</span>
                  </button>

                  {/* SUB SECTIONS */}
                  {section.children && openSection === idx && (
                    <div className="ml-4 mt-1 space-y-1">
                      {section.children.map((sub, sidx) => (
                        <NavLink
                          key={sidx}
                          to={sub.path}
                          className="block px-4 py-2 rounded-lg text-sm hover:bg-purple-100 hover:text-purple-700 transition"
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MainDropdown;
