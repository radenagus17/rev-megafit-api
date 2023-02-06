const { tblPromo } = require("../models");

class promo {
  static async create(req, res, next) {
    try {
      let data = {
        name: req.body.name,
        poster: req.file.path,
        phone: req.body.phone,
        address: req.body.address,
        promo: req.body.promo,
      };

      await tblPromo.create(data);
      res.status(201).json({ message: "Success" });
    } catch (error) {
      next(error);
    }
  }

  static async edit(req, res, next) {
    try {
      let data = {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        promo: req.body.promo,
      };

      if (req.file) data.poster = req.file.path;

      await tblPromo.update(data, { where: { id: req.params.id } });
      res.status(200).json({ message: "Success" });
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req, res, next) {
    try {
      let data = await tblPromo.findAll();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async findOne(req, res, next) {
    try {
      let data = await tblPromo.findOne({
        where: {
          id: req.params.id,
        },
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      let deleted = await tblPromo.destroy({
        where: { id: req.params.id },
      });
      if (!deleted) throw { name: "notFound" };
      res.status(200).json({ message: "Success", deleted: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = promo;
