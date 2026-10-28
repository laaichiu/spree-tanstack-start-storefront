export function categoryResource(overrides: Record<string, unknown> = {}) {
  return {
    children_count: 0,
    depth: 0,
    description: 'Category description',
    description_html: '<p>Category description</p>',
    id: 'ctg_category',
    image_url: null,
    is_child: false,
    is_leaf: true,
    is_root: true,
    meta_description: null,
    meta_keywords: null,
    meta_title: null,
    name: 'Category',
    parent_id: null,
    permalink: 'category',
    position: 0,
    square_image_url: null,
    ...overrides,
  }
}
