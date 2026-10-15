import React, { useEffect, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css"; // Ensure this is properly loaded
import { FaTools } from "react-icons/fa";
import { BsTruck } from "react-icons/bs";
import { FaBasketShopping } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";

import CarRent from "./CarRent";
import Cars from "./Cars";
import Mechanics from "./Mechanics";
import CarAnimation from "./CarAnimation";
import Hire from "./Hire";
import Spareparts from "../Spareparts/Spareparts";
import Container from "@/components/ui/Container";
import { tabItemClass, tabListClass } from "@/components/ui/tabStyles";

const tabs = [
  { label: "Order KIA" },
  { label: "Truck", Icon: BsTruck },
  { label: "Mechanics", Icon: FaTools },
  { label: "Spare Parts", Icon: FaBasketShopping },
];

export default function TabView() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get the tab index from the URL (state passed through routing)
  const initialIndex = new URLSearchParams(location.search).get("tab") || 0;

  const [selectedIndex, setSelectedIndex] = useState(Number(initialIndex));

  // Update URL when selected tab changes
  useEffect(() => {
    // Update the URL query parameter when the tab changes
    // Keep any other query params (e.g. ?query= from a homepage search)
    // so the tab's screen can still read them.
    const params = new URLSearchParams(window.location.search);
    params.set("tab", selectedIndex);
    navigate(`?${params.toString()}`, { replace: true });
  }, [selectedIndex, navigate]);

  return (
    <div className="min-h-screen bg-ink-50 pt-20 sm:pt-24 pb-10">
      <Container>
        <h1 className="font-display text-2xl font-bold text-ink-900 mb-4">
          KIA &amp; Rides
        </h1>
        <Tabs
          selectedIndex={selectedIndex}
          onSelect={(index) => setSelectedIndex(index)}
        >
          <TabList className={`${tabListClass} sticky top-16 sm:top-20 z-20`}>
            {tabs.map(({ label, Icon }, index) => (
              <Tab key={label} className={tabItemClass(selectedIndex === index)}>
                <div className="flex justify-center">
                  {Icon ? (
                    <Icon className="text-lg sm:text-xl" />
                  ) : (
                    <div className="scale-[0.55] sm:scale-75">
                      <CarAnimation />
                    </div>
                  )}
                </div>
                <span className="text-[11px] sm:text-sm font-semibold">
                  {label}
                </span>
              </Tab>
            ))}
          </TabList>

          <TabPanel className="pt-5">
            <Cars />
          </TabPanel>
          <TabPanel className="pt-5">
            <Hire />
          </TabPanel>
          <TabPanel className="pt-5">
            <Mechanics />
          </TabPanel>
          <TabPanel className="pt-5">
            <Spareparts />
          </TabPanel>
        </Tabs>
      </Container>
    </div>
  );
}
