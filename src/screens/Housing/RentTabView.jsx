import React, { useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import HousingScreen from './HousingScreen';
import EquipmentScreen from '../Equipments/EquipmentScreen';
import Delivery from '../Delivery/Delivery';
import { MdDeliveryDining, MdHomeRepairService } from "react-icons/md";
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBuildingColumns } from "react-icons/fa6";
import Container from '../../components/ui/Container';
import { tabItemClass, tabListClass } from '../../components/ui/tabStyles';

const tabs = [
  { label: "Housing", Icon: FaBuildingColumns },
  { label: "Equipment", Icon: MdHomeRepairService },
  { label: "Delivery", Icon: MdDeliveryDining },
];

export default function RentTabView() {
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
    <div className="min-h-screen bg-ink-50 pt-20 pb-10 sm:pt-24">
      <Container>
        <h1 className="mb-4 font-display text-2xl font-bold text-ink-900">Rent</h1>
        <Tabs selectedIndex={selectedIndex} onSelect={(index) => setSelectedIndex(index)}>
          <TabList className={`${tabListClass} sticky top-16 z-20 sm:top-20`}>
            {tabs.map(({ label, Icon }, index) => (
              <Tab key={label} className={tabItemClass(selectedIndex === index)}>
                <Icon className="text-lg sm:text-xl" />
                <span className="text-[11px] font-semibold sm:text-sm">{label}</span>
              </Tab>
            ))}
          </TabList>

          <TabPanel className="pt-5">
            <HousingScreen />
          </TabPanel>
          <TabPanel className="pt-5">
            <EquipmentScreen />
          </TabPanel>
          <TabPanel className="pt-5">
            <Delivery />
          </TabPanel>
        </Tabs>
      </Container>
    </div>
  );
}
