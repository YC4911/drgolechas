export interface CategoryNavigationItem {
  name: string;
  slug: string;
}

export interface StoreCategory extends CategoryNavigationItem {
  description: string;
  image: string;
  parentCategoryId: string | null;
}
