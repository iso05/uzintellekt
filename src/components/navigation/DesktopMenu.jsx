// src/components/navigation/DesktopMenu.jsx
import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { navConfig } from "../../utils/navConfig";

const DesktopMenu = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [openSub, setOpenSub] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenMenu(null);
        setOpenSub(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <ul ref={ref} className="flex items-center gap-6">
      {navConfig.map((item, idx) => (
        <li key={idx} className="relative">

          {item.disabled ? (
            // DISABLED
            <div className="relative group">
              <button
                disabled
                className="flex items-center gap-1 px-4 py-2 rounded-full text-white/40 cursor-not-allowed select-none"
              >
                {item.label}
                {item.children && <span className="text-xs">▼</span>}
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/15 text-white/50 text-[10px] font-medium">
                  Tez kunda
                </span>
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Hozircha mavjud emas
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </div>

          ) : item.path && !item.children ? (
            // SIMPLE LINK
            <NavLink
              to={item.path}
              className="px-4 py-2 rounded-full text-white/90 hover:bg-white/15 transition"
              onClick={() => { setOpenMenu(null); setOpenSub(null); }}
            >
              {item.label}
            </NavLink>

          ) : (
            // DROPDOWN TRIGGER
            <button
              onClick={() => {
                setOpenMenu(openMenu === idx ? null : idx);
                setOpenSub(null);
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-full text-white/90 hover:bg-white/15 transition"
            >
              {item.label}
              {item.children && <span className="text-xs">▼</span>}
            </button>
          )}

          {/* FIRST DROPDOWN */}
          {!item.disabled && item.children && openMenu === idx && (
            <div className="absolute left-0 top-full mt-3 w-64 bg-white rounded-xl shadow-lg border py-2 z-50">
              {item.children.map((child, cIdx) => (
                <div key={cIdx} className="relative">
                  {child.children ? (
                    <button
                      onClick={() => setOpenSub(openSub === cIdx ? null : cIdx)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-purple-50 text-gray-800"
                    >
                      {child.label}
                      <span className="text-xs">▶</span>
                    </button>
                  ) : child.file ? (
                    <a
                      href={child.file}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 hover:bg-purple-50 text-gray-800"
                      onClick={() => { setOpenMenu(null); setOpenSub(null); }}
                    >
                      {child.label}
                    </a>
                  ) : (
                    <NavLink
                      to={child.path}
                      className="block px-4 py-2 hover:bg-purple-50 text-gray-800"
                      onClick={() => setOpenMenu(null)}
                    >
                      {child.label}
                    </NavLink>
                  )}

                  {child.children && openSub === cIdx && (
                    <div className="absolute left-full top-0 ml-1 w-64 bg-white rounded-xl shadow-lg border py-2">
                      {child.children.map((sub, sIdx) =>
                        sub.file ? (
                          <a key={sIdx} href={sub.file} download target="_blank" rel="noopener noreferrer"
                            className="block px-4 py-2 hover:bg-purple-50 text-gray-800"
                            onClick={() => { setOpenMenu(null); setOpenSub(null); }}>
                            {sub.label}
                          </a>
                        ) : (
                          <NavLink key={sIdx} to={sub.path}
                            className="block px-4 py-2 hover:bg-purple-50 text-gray-800"
                            onClick={() => { setOpenMenu(null); setOpenSub(null); }}>
                            {sub.label}
                          </NavLink>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default DesktopMenu;
