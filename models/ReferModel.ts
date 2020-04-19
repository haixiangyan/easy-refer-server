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
  @Column(DataTypes.DATE)
  public updatedOn!: Date | null

  // 外键
  @ForeignKey(() => ResumeModel)
  public resumeId!: string | null

  @ForeignKey(() => JobModel)
  public jobId!: string

  @ForeignKey(() => UserModel)
  public refererId!: string

  @ForeignKey(() => UserModel)
  public refereeId!: string

  // 关系
  @HasOne(() => ResumeModel)
  public readonly resume?: ResumeModel

  @BelongsTo(() => JobModel)
  public readonly job?: JobModel

  @BelongsTo(() => UserModel, 'userId')
  public readonly referer?: UserModel

  @BelongsTo(() => UserModel, 'userId')
  public readonly referee?: UserModel
}

export default ReferModel
