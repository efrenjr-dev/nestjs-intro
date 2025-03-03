import {
  BadRequestException,
  Body,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreatePostDto } from '../dtos/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { UsersService } from 'src/users/providers/users.service';
import { Repository } from 'typeorm';
import { TagsService } from 'src/tags/providers/tags.service';
import { ActiveUserData } from 'src/auth/interfaces/active-user.interface';

@Injectable()
export class CreatePostProvider {
  constructor(
    private readonly usersService: UsersService,

    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,

    private readonly tagsService: TagsService,
  ) {}
  public async create(createPostDto: CreatePostDto, user: ActiveUserData) {
    let author = undefined;
    let tags = undefined;
    try {
      //find author from database based on authorId
      author = await this.usersService.findOneById(user.sub);
      //Find tags
      tags = await this.tagsService.findMultipleTags(createPostDto.tags);
      console.log(tags);
    } catch (error) {
      throw new ConflictException(error);
    }

    if (tags.length !== createPostDto.tags.length) {
      throw new BadRequestException('Please check your tag Ids');
    }

    //create post
    let post = this.postsRepository.create({
      ...createPostDto,
      author: author,
      tags: tags,
    });

    //add exception handling

    try {
      //return the post
      return await this.postsRepository.save(post);
    } catch (error) {
      throw new ConflictException(error, {
        description: 'Ensure post slug is unique and not a duplicate',
      });
    }
  }
}
