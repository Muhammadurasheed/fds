export interface NavItem {
  title: string;
  href: string;
  description: string;
  iconName: "Compass" | "Calculator" | "LineChart" | "Database" | "BookOpen";
  badge?: string;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/",
    description: "Model introduction, principal outputs, and engineering scope",
    iconName: "Compass",
  },
  {
    title: "Estimate",
    href: "/estimate",
    description: "Single-point drilling condition calculation with uncertainty bands",
    iconName: "Calculator",
  },
  {
    title: "Charts",
    href: "/charts",
    description: "Parametric sensitivity sweeps over time, deviation angle, and pressure",
    iconName: "LineChart",
  },
  {
    title: "Dataset Generator",
    href: "/dataset",
    description: "Configure multi-dimensional parameter grids and export CSV datasets",
    iconName: "Database",
  },
  {
    title: "Methodology & Validity",
    href: "/methodology",
    description: "Governing equations, calibration constants, and model boundaries",
    iconName: "BookOpen",
  },
];

export const SCIENTIFIC_DOMAIN = {
  time: {
    min: 36.0,
    max: 120.0,
    unit: "hr",
    label: "Exposure Time",
    description: "Duration of drilling fluid contact with the permeable formation",
  },
  angle: {
    min: 30.0,
    max: 90.0,
    unit: "°",
    label: "Deviation Angle",
    description: "Wellbore inclination relative to vertical (0° = vertical, 90° = horizontal)",
  },
  pressure: {
    min: 650.0,
    max: 4650.0,
    unit: "psi",
    label: "Mud Pressure",
    description: "Differential overbalance or effective wellbore mud pressure",
  },
  calibrations: [
    {
      id: "experimental",
      name: "Experimental Data (Default)",
      description: "Direct empirical fit to digitised physical core-flood observations",
    },
    {
      id: "model",
      name: "Akinsete & Isehunwa (2013) Model Curve",
      description: "Published mathematical curve fit parameters from source study",
    },
  ],
};
