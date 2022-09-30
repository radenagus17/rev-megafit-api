const { tblTaskPT, tblMember, tblFoodTracking } = require("../models");

class taskControllers {
  static async create(req, res, next) {
    try {
      // Untuk add task per indivitu
      if (req.body.memberId) {
        await tblTaskPT.create(req.body);
      } else {
        // Untuk add task buat semua member
        let member = await tblMember.findAll({ where: { ptId: req.body.ptId } });
        member.push({ memberId: null });

        await member.forEach(async (element) => {
          req.body.memberId = element.memberId;
          await tblTaskPT.create(req.body);
        });
      }

      res.status(201).json({ Message: "Succesfully create task." });
    } catch (error) {
      next(error);
    }
  }

  static async addFood(req, res, next) {
    try {
      await tblFoodTracking.create(req.body);
      res.status(201).json({ Message: "Succesfully create task." });
    } catch (error) {
      next(error);
    }
  }

  static async findPTTask(req, res, next) {
    try {
      let task = await tblTaskPT.findAll({
        where: {
          ptId: req.params.ptId,
          memberId: null,
          year: new Date().getFullYear(),
          week: req.params.week,
        },
      });
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      await tblTaskPT.update({ taskDone: req.body.status }, { where: { id: req.params.id } });
      res.status(200).json({ Message: "Succesfully update status task." });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = taskControllers;
