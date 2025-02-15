import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const {
      q = '',
      category,
      priceMin,
      priceMax,
      ratings,
      inStock,
      attributes,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const filters = {
      category: category as string,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      ratings: ratings ? Number(ratings) : undefined,
      inStock: inStock === 'true',
      attributes: attributes ? JSON.parse(attributes as string) : undefined
    };

    const sort = {
      field: sortBy as string,
      order: sortOrder as 'asc' | 'desc'
    };

    const results = await SearchService.searchProducts(
      q as string,
      filters,
      sort,
      Number(page),
      Number(limit)
    );

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error performing search' });
  }
};

export const getProductSuggestions = async (req: Request, res: Response) => {
  try {
    const { q = '', limit = 5 } = req.query;
    const suggestions = await SearchService.getProductSuggestions(
      q as string,
      Number(limit)
    );
    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
};
