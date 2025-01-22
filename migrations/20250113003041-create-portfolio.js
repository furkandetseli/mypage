'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Portfolios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      image: {
        type: Sequelize.STRING
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Genel'
      },
      technologies: {
        type: Sequelize.STRING,
        allowNull: false
      },
      projectUrl: {
        type: Sequelize.STRING,
        field: 'project_url'
      },
      githubUrl: {
        type: Sequelize.STRING,
        field: 'github_url'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Portfolios');
  }
}; 