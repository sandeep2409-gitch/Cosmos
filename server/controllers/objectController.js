import { ObjectService } from '../services/objectService.js';

/**
 * Celestial Objects API Controller
 */
export const getAllObjects = (req, res, next) => {
  try {
    const typeFilter = req.query.type || null;
    const objects = ObjectService.getAllObjects(typeFilter);

    res.status(200).json({
      success: true,
      count: objects.length,
      data: objects
    });
  } catch (err) {
    next(err);
  }
};

export const getObjectById = (req, res, next) => {
  try {
    const { id } = req.params;
    const object = ObjectService.getObjectById(id);

    if (!object) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: `Celestial object not found with ID: '${id}'`
        }
      });
    }

    res.status(200).json({
      success: true,
      data: object
    });
  } catch (err) {
    next(err);
  }
};
