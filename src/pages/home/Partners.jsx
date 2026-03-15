import haierLogo from "../../assets/logo/haier-logo.svg";
import eaLogo from "../../assets/logo/ea-games-pure-design.svg";

const partners = [
  { name: "Haier", logo: haierLogo },
  { name: "EA Games", logo: eaLogo },
  { name: "EA Games", logo: eaLogo },
  { name: "Haier", logo: haierLogo },
  { name: "EA Games", logo: eaLogo },
  { name: "EA Games", logo: eaLogo },
];

const Partners = () => {
  return (
    <section className="relative partners-bg py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold gradient-title mb-14 text-center">
          Hamkorlarimiz
        </h2>

        <div className="relative overflow-hidden">
          <div className="partners-track">
            {[...partners, ...partners].map((item, idx) => (
              <div key={idx} className="partner-card">
                <img
                  src={item.logo}
                  alt={item.name}
                  className="partner-logo"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
