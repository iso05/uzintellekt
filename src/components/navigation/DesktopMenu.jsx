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

          {/* ===== MAIN ITEM ===== */}
          {item.disabled ? (
            <div className="relative group">
              <button
                disabled
                className="flex items-center gap-1 px-4 py-2 rounded-full text-white/40 cursor-not-allowed"
              >
                {item.label}
                <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                  Tez kunda
                </span>
              </button>
            </div>

          ) : item.path && !item.children ? (
            <NavLink
              to={item.path}
              className="px-4 py-2 rounded-full text-white/90 hover:bg-white/15"
              onClick={() => { setOpenMenu(null); setOpenSub(null); }}
            >
              {item.label}
            </NavLink>

          ) : (
            <button
              onClick={() => {
                setOpenMenu(openMenu === idx ? null : idx);
                setOpenSub(null);
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-full text-white/90 hover:bg-white/15"
            >
              {item.label}
              {item.children && <span className="text-xs">▼</span>}
            </button>
          )}

          {/* ===== FIRST DROPDOWN ===== */}
          {!item.disabled && item.children && openMenu === idx && (
            <div className="absolute left-0 top-full mt-3 w-64 bg-white rounded-xl shadow-lg border py-2 z-50">
              {item.children.map((child, cIdx) => (
                <div key={cIdx} className="relative">

                  {/* ===== CHILD DISABLED ===== */}
                  {child.disabled ? (
                    <div className="px-4 py-2 text-gray-400 cursor-not-allowed flex justify-between items-center">
                      {child.label}
                      <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">
                        Tez kunda
                      </span>
                    </div>

                  ) : child.children ? (
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

                  {/* ===== SUB DROPDOWN ===== */}
                  {child.children && openSub === cIdx && (
                    <div className="absolute left-full top-0 ml-1 w-64 bg-white rounded-xl shadow-lg border py-2">
                      {child.children.map((sub, sIdx) => (

                        sub.disabled ? (
                          <div key={sIdx} className="px-4 py-2 text-gray-400 cursor-not-allowed flex justify-between">
                            {sub.label}
                            <span className="text-[10px] bg-gray-200 px-1 rounded">
                              Tez kunda
                            </span>
                          </div>

                        ) : sub.file ? (
                          <a
                            key={sIdx}
                            href={sub.file}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-2 hover:bg-purple-50 text-gray-800"
                            onClick={() => { setOpenMenu(null); setOpenSub(null); }}
                          >
                            {sub.label}
                          </a>

                        ) : (
                          <NavLink
                            key={sIdx}
                            to={sub.path}
                            className="block px-4 py-2 hover:bg-purple-50 text-gray-800"
                            onClick={() => { setOpenMenu(null); setOpenSub(null); }}
                          >
                            {sub.label}
                          </NavLink>
                        )

                      ))}
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