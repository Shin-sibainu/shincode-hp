// components/NavBar.js
import { useRef } from "react";
import { useRouter } from "next/router";

const NavBar = () => {
  const router = useRouter();

  const handleClick = (e: any, id: any) => {
    e.preventDefault();
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed w-full z-30 top-7 text-white bg-black bg-opacity-60">
      <div className="w-full container mx-auto flex flex-wrap items-center justify-between mt-0 py-2">
        <div className="pl-4 flex items-center">
          <a
            className="text-white no-underline hover:text-white hover:no-underline font-light text-2xl lg:text-4xl"
            href="#"
          >
            ShinCode
          </a>
        </div>
        <div className="block lg:hidden pr-4">
          {/* Mobile menu button */}
          {/* TODO: Add onClick event for mobile menu */}
        </div>
        <div className="w-full flex-grow sm:flex lg:items-center lg:w-auto mt-2 lg:mt-0 bg-black bg-opacity-60 z-20">
          <ul className="sm:flex justify-end flex-1 items-center">
            <li className="mr-3">
              <a
                className="inline-block py-1 px-4 text-white no-underline"
                href="#"
                onClick={(e) => handleClick(e, "product")}
              >
                Product
              </a>
            </li>
            <li className="mr-3">
              <a
                className="inline-block text-white no-underline hover:text-gray-200 hover:text-underline py-2 px-4"
                href="#"
                onClick={(e) => handleClick(e, "about")}
              >
                About
              </a>
            </li>
            <li className="mr-3">
              <a
                className="inline-block text-white no-underline hover:text-gray-200 hover:text-underline py-2 px-4"
                href="#"
                onClick={(e) => handleClick(e, "contact")}
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
