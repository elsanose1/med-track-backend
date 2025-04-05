export interface FDALabelResponse {
  meta: Meta;
  results: Result[];
}

interface Meta {
  disclaimer: string;
  terms: string;
  license: string;
  last_updated: string;
  results: {
    skip: number;
    limit: number;
    total: number;
  };
}

interface Result {
  spl_product_data_elements: string[];
  spl_unclassified_section: string[];
  active_ingredient: string[];
  purpose: string[];
  indications_and_usage: string[];
  warnings: string[];
  keep_out_of_reach_of_children: string[];
  dosage_and_administration: string[];
  other_safety_information: string[];
  inactive_ingredient: string[];
  questions: string[];
  package_label_principal_display_panel: string[];
  set_id: string;
  id: string;
  effective_time: string;
  version: string;
  openfda: OpenFDA;
}

interface OpenFDA {
  brand_name: string[];
  generic_name: string[];
  manufacturer_name: string[];
  product_ndc: string[];
  product_type: string[];
  route: string[];
  substance_name: string[];
  spl_id: string[];
  spl_set_id: string[];
  package_ndc: string[];
  is_original_packager: boolean[];
  upc: string[];
  unii: string[];
}

export interface PatientDrugInfo {
  id: string;
  brandName: string;
  genericName: string;
  purpose: string[];
  activeIngredients: string[];
  warnings: string[];
  usage: string[];
  sideEffects?: string[];
  whenToStop?: string[];
  dosage: string[];
  manufacturer: string;
  substanceNames: string[];
  route: string[];
}
