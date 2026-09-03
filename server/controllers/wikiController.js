import { WikiService } from '../services/wikiService.js';

/**
 * Wikipedia API Controller
 */
export const getWikipediaData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wikiData = await WikiService.getWikipediaSummary(id);

    if (!wikiData) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: `Wikipedia summary not available for object ID: '${id}'`
        }
      });
    }

    res.status(200).json(wikiData);
  } catch (err) {
    next(err);
  }
};
