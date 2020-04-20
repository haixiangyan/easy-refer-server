import {DataTypes} from 'sequelize'
import {
  AllowNull,
  BelongsTo,
  Column,
  Default,
  ForeignKey,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  Unique
} from 'sequelize-typescript'
import ResumeModel from '@/models/ResumeModel'
import JobModel from '@/models/JobModel'
import UserModel from '@/models/UserModel'

@Table({tableName: 'refers'})
class ReferModel extends Model<ReferModel> {
  // 字段
  @Unique
  @AllowNull(false)
  @PrimaryKey
  @Column(DataTypes.STRING)
  public referId!: string

  @Column(DataTypes.STRING)
  public name!: string | null

  @Column(DataTypes.STRING)
  public email!: string | null

  @Column(DataTypes.STRING)
  public phone!: string | null

  @Column(DataTypes.INTEGER)
  public experience!: number | null

  @Column(DataTypes.TEXT)
  public intro!: string | null

  @Column(DataTypes.STRING)
  public leetCodeUrl!: string | null

  @Column(DataTypes.TEXT)
  public thirdPersonIntro!: string | null

  @Column(DataTypes.TEXT)
  public referLinks!: string | null

  @Column(DataTypes.STRING)
  public status!: string | null

  @Default(new Date())
  @Column(DataTypes.DATEONLY)
  public updatedOn!: Date | null

  // 外键
  @ForeignKey(() => ResumeModel)
  @Column(DataTypes.STRING)
  public resumeId!: string | null

  @ForeignKey(() => JobModel)
  @Column(DataTypes.STRING)
  public jobId!: string

  @ForeignKey(() => UserModel)
  @Column(DataTypes.STRING)
  public refererId!: string

  @ForeignKey(() => UserModel)
  @Column(DataTypes.STRING)
  public refereeId!: string

  // 关系
  @HasOne(() => ResumeModel)
  public readonly resume?: ResumeModel

  @BelongsTo(() => JobModel, 'jobId')
  public readonly job!: JobModel

  @BelongsTo(() => UserModel, 'refererId')
  public readonly referer!: UserModel

  @BelongsTo(() => UserModel, 'refereeId')
  public readonly referee!: UserModel
}

export default ReferModel
