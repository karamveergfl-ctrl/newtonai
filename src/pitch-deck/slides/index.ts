import Slide01Intro from "./Slide01Intro";
import Slide02Problem from "./Slide02Problem";
import Slide03Solution from "./Slide03Solution";
import Slide04Market from "./Slide04Market";
import Slide05BusinessModel from "./Slide05BusinessModel";
import Slide06Financials from "./Slide06Financials";
import Slide07InvestmentAsk from "./Slide07InvestmentAsk";
import Slide08UseOfFunds from "./Slide08UseOfFunds";
import Slide09ThankYou from "./Slide09ThankYou";

export const DECK_SLIDES: { title: string; Component: React.ComponentType }[] = [
  { title: "Company Introduction", Component: Slide01Intro },
  { title: "The Problem", Component: Slide02Problem },
  { title: "The Solution", Component: Slide03Solution },
  { title: "Market & Competition", Component: Slide04Market },
  { title: "Business Model", Component: Slide05BusinessModel },
  { title: "5-Year Financials", Component: Slide06Financials },
  { title: "Investment Ask", Component: Slide07InvestmentAsk },
  { title: "Use of Funds", Component: Slide08UseOfFunds },
  { title: "Thank You", Component: Slide09ThankYou },
];